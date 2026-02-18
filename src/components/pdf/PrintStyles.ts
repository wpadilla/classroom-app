// PrintStyles.js
import { StyleSheet } from '@react-pdf/renderer';

const pdfStyles = StyleSheet.create({
  page: {
    backgroundColor: '#fff',
    padding: 20,
    flexDirection: 'column',
    gap: 20,
    width: '100%',
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    width: '100%',
  },
  logo: {
    width: 90,
    height: 90,
    marginRight: 10,
  },
  title: {
    fontSize: 24,
  },
  sectionContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    width: '100%',
  },
  section: {
    width: '100%',
    padding: 10,
    borderWidth: 1,
    borderColor: '#e4e4e4',
    borderRadius: 5,
  },
  sectionComplet: {
    width: '90%',
    margin: 'auto',
    padding: 10,
    borderWidth: 1,
    borderColor: '#e4e4e4',
    borderRadius: 5,
  },
  sectionTitle: {
    fontSize: 16,
    marginBottom: 10,
    fontWeight: 'bold',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    alignItems: 'center',
    marginBottom: 5,
  },
  label: {
    fontSize: 13,
    fontWeight: 'bold',
  },
  value: {
    fontSize: 9,
  },
  table: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#e4e4e4',
    borderRadius: 5,
    overflow: 'hidden',
    // margin: '10px 0px'
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f2f2f2',
    padding: 8,
  },
  tableHeaderCell: {
    flex: 1,
    textAlign: 'left',
    fontSize: 12,
    fontWeight: 'bold',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e4e4e4',
    padding: 8,
  },
  tableBodyCell: {
    flex: 1,
    fontSize: 12,
  },
});

export default pdfStyles;
